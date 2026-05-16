package com.x.query.core.entity.neural;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import org.apache.openjpa.persistence.jdbc.Index;

import com.x.base.core.entity.JpaObject;
import com.x.base.core.entity.SliceJpaObject;
import com.x.base.core.entity.annotation.CheckPersist;
import com.x.base.core.entity.annotation.ContainerEntity;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.query.core.entity.PersistenceProperties;

import io.swagger.v3.oas.annotations.media.Schema;
@Schema(name = "OutValue", description = "数据中心神经网络结果值.")
@Entity
@ContainerEntity(dumpSize = 1000, type = ContainerEntity.Type.content, reference = ContainerEntity.Reference.strong)
@Table(name = PersistenceProperties.Neural.OutValue.table, uniqueConstraints = {
		@UniqueConstraint(name = PersistenceProperties.Neural.OutValue.table + JpaObject.IndexNameMiddle
				+ JpaObject.DefaultUniqueConstraintSuffix, columnNames = { JpaObject.IDCOLUMN,
						JpaObject.CREATETIMECOLUMN, JpaObject.UPDATETIMECOLUMN, JpaObject.SEQUENCECOLUMN }) })
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public class OutValue extends SliceJpaObject {

	private static final long serialVersionUID = -5610293696763235753L;

	private static final String TABLE = PersistenceProperties.Neural.OutValue.table;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	@FieldDescribe("数据库主键,自动生成.")
	@Id
	@Column(length = length_id, name = ColumnNamePrefix + id_FIELDNAME)
	private String id = createId();

	/* 以上为 JpaObject 默认字段 */

	public void onPersist() throws Exception {

	}

	/* 更新运行方法 */

	public static final String text_FIELDNAME = "text";
	@FieldDescribe("值")
	@Column(length = length_255B, name = ColumnNamePrefix + text_FIELDNAME)
	@Index(name = TABLE + IndexNameMiddle + text_FIELDNAME)
	@CheckPersist(allowEmpty = true)
	private String text;

	public static final String model_FIELDNAME = "model";
	@FieldDescribe("模型")
	@Column(length = length_id, name = ColumnNamePrefix + model_FIELDNAME)
	@Index(name = TABLE + IndexNameMiddle + model_FIELDNAME)
	@CheckPersist(allowEmpty = false)
	private String model;

	public static final String serial_FIELDNAME = "serial";
	@FieldDescribe("编号")
	@Column(name = ColumnNamePrefix + serial_FIELDNAME)
	@Index(name = TABLE + IndexNameMiddle + serial_FIELDNAME)
	@CheckPersist(allowEmpty = false)
	private Integer serial;

	public static final String count_FIELDNAME = "count";
	@FieldDescribe("数量")
	@Column(name = ColumnNamePrefix + count_FIELDNAME)
	@Index(name = TABLE + IndexNameMiddle + count_FIELDNAME)
	@CheckPersist(allowEmpty = false)
	private Integer count;

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public Integer getCount() {
		return count;
	}

	public void setCount(Integer count) {
		this.count = count;
	}

	public Integer getSerial() {
		return serial;
	}

	public void setSerial(Integer serial) {
		this.serial = serial;
	}

	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

}